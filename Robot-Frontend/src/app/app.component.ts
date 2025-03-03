import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  isForward: boolean = true;
  private socket!: WebSocket;

  ngOnInit() {
    // Initialize joystick when component is ready
    this.initWebSocket();
    this.initJoystick();
  }

  ngAfterViewInit() {
    // Start the camera feed after the view is initialized
    this.startCameraFeed();
  }

  startCameraFeed() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.nativeElement.srcObject = stream;
      })
      .catch((error) => console.error('Error accessing webcam:', error));
  }

  toggleDirection() {
    this.isForward = !this.isForward;
  }

  initWebSocket() {
    this.socket = new WebSocket('ws://your-raspberry-pi-ip:9090'); // Connect to rosbridge

    this.socket.onopen = () => {
      console.log('Connected to ROS2 via rosbridge');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    this.socket.onmessage = (event) => {
      console.log('Message from ROS2:', event.data);
    };
  }

  sendJoystickCommand(topic: string, direction: string) {
    const message = {
      op: 'publish',
      topic: topic,
      msg: {
        data: direction
      }
    };
    this.socket.send(JSON.stringify(message));
  }

  initJoystick() {
  const leftJoystickElement = document.getElementById('joystick-left');
  const rightJoystickElement = document.getElementById('joystick-right');

  if (leftJoystickElement) {
    const leftJoystick = nipplejs.create({
      zone: leftJoystickElement,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'blue',
      size: 100,
      lockY: true, // Left joystick moves only up/down
    });

    leftJoystick.on('move', (event, data) => {
      console.log('Joystick Left:', data.direction.angle);
      this.sendJoystickCommand('/joystick_left', data.direction.angle);
    });

    leftJoystick.on('end', () => {
      this.sendJoystickCommand('/joystick_left', 'STOP');
    });
  }

  if (rightJoystickElement) {
    const rightJoystick = nipplejs.create({
      zone: rightJoystickElement,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'red',
      size: 100,
      lockX: true, // Right joystick moves only left/right
    });

    rightJoystick.on('move', (event, data) => {
      if (data.direction) {
        console.log('Joystick Right:', data.direction.angle);
        this.sendJoystickCommand('/joystick_right', data.direction.angle);
      }
    });

    rightJoystick.on('end', () => {
      this.sendJoystickCommand('/joystick_right', 'STOP');
    });
  }
}
}
