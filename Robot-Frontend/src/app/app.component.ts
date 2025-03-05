import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';
import * as ROSLIB from 'roslib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  isForward: boolean = true;
  private ros!: ROSLIB.Ros;
  private leftJoystickPublisher!: ROSLIB.Topic;
  private rightJoystickPublisher!: ROSLIB.Topic;

  ngOnInit() {
    this.initRosConnection();
    this.initJoystick();
  }

  ngAfterViewInit() {
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

  initRosConnection() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.1.29:9090' // Replace with actual IP
    });

    this.ros.on('connection', () => {
      console.log('Connected to ROS 2 via rosbridge');
    });

    this.ros.on('error', (error) => {
      console.error('WebSocket Error:', error);
    });

    this.ros.on('close', () => {
      console.log('Connection to rosbridge closed.');
    });

    // Define publishers for joystick topics
    this.leftJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/joystick_left',
      messageType: 'geometry_msgs/Twist'
    });

    this.rightJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/steering_angle',
      messageType: 'std_msgs/Float32'
    });
  }

  sendJoystickCommand(publisher: ROSLIB.Topic, angle: number) {
    console.log(`Publishing to ${publisher.name}: angle=${angle}`);
    
    const message = new ROSLIB.Message({
      data: angle
    });

    publisher.publish(message);
  }


  initJoystick() {
    const leftJoystickElement = document.getElementById('joystick-left');
    const rightJoystickElement = document.getElementById('joystick-right');

    // if (leftJoystickElement) {
    //   const leftJoystick = nipplejs.create({
    //     zone: leftJoystickElement,
    //     mode: 'static',
    //     position: { left: '50%', top: '50%' },
    //     color: 'blue',
    //     size: 100,
    //     lockY: true // Left joystick moves only up/down
    //   });

    //   leftJoystick.on('move', (event, data) => {
    //     const x = 0.0; // No rotation for left joystick
    //     const y = data.force; // Movement speed based on joystick force
    //     console.log('Joystick Left:', y);
    //     this.sendJoystickCommand(this.leftJoystickPublisher, x, y);
    //   });

    //   leftJoystick.on('end', () => {
    //     this.sendJoystickCommand(this.leftJoystickPublisher, 0, 0);
    //   });
    // }

    if (rightJoystickElement) {
      const rightJoystick = nipplejs.create({
        zone: rightJoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'red',
        size: 100,
        lockX: true // Right joystick moves only left/right
      });

      rightJoystick.on('move', (event, data) => {
        const x = data.force; // Rotation speed based on joystick force
        const y = 0.0; // No linear movement for right joystick
        console.log('Joystick Right:', x);
        this.sendJoystickCommand(this.rightJoystickPublisher, x);
      });

      rightJoystick.on('end', () => {
        this.sendJoystickCommand(this.rightJoystickPublisher, 90);
      });
    }
  }
}
